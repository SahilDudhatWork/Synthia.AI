import axios from 'axios';
import { supabase } from '../../lib/supabaseClient';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt, userId, workspaceId, ai_model_id, system_prompt, } = req.body;

    // if (!prompt || !userId || !workspaceId || !ai_model_id) {
    //     return res.status(400).json({
    //         error: "Missing required fields",
    //         required: ["prompt", "userId", "workspaceId", "ai_model_id"]
    //     });
    // }

    try {
        let { data } = await supabase.from("workspaces").select("*").eq("id", workspaceId);
        data = data?.[0];

        let defaultPrompt = generateWorkspaceContext(data);

        defaultPrompt += system_prompt

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4.1", // or gpt-4o
                messages: [
                    { role: "system", content: defaultPrompt },
                    { role: "user", content: prompt },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );


        const result = response.data?.choices?.[0]?.message?.content || "No output.";
        return res.status(200).json({ type: "text", result });
    } catch (err: any) {
        console.error("API Error:", err.response ? err.response.data : err.message);
        return res.status(500).json({
            error: "Internal server error",
            details: err instanceof Error ? err.message : "Unknown error"
        });
    }
}

function generateWorkspaceContext(workspace: any): string {
    if (!workspace) {
        return "No user context available.";
    }

    const contextParts = [];

    if (workspace.name) contextParts.push(`Name: ${workspace.name}`);
    if (workspace.age) contextParts.push(`Age: ${workspace.age}`);
    if (workspace.gender) contextParts.push(`Gender: ${workspace.gender}`);
    if (workspace.interests && workspace.interests.length > 0)
        contextParts.push(`Interests: ${Array.isArray(workspace.interests) ? workspace.interests.join(', ') : workspace.interests}`);
    if (workspace.goals && workspace.goals.length > 0)
        contextParts.push(`Goals: ${Array.isArray(workspace.goals) ? workspace.goals.join(', ') : workspace.goals}`);
    if (workspace.personality_type) contextParts.push(`Personality Type: ${workspace.personality_type}`);
    if (workspace.preferred_communication && workspace.preferred_communication.length > 0)
        contextParts.push(`Communication Style: ${Array.isArray(workspace.preferred_communication) ? workspace.preferred_communication.join(', ') : workspace.preferred_communication}`);

    return contextParts.join('\n') || 'Basic user profile available.';
}