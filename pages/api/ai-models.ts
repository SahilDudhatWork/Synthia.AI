import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from "../../lib/supabaseClient";

interface AIModelInput {
    workspace_id: string;
    name: string;
    role: string;
    personality: string;
    predefined: boolean;
    topics?: string[];
    system_prompt?: string;
    custom_triggers?: string[];
    config?: any;
    is_active?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const modelData: AIModelInput = req.body;

        // Validate required fields
        if (!modelData.name || !modelData.role || !modelData.personality) {
            return res.status(400).json({ error: 'Name, role, and personality are required' });
        }

        // Check if workspace exists (optional, but good practice)
        const { data: workspace, error: workspaceError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('id', modelData.workspace_id)
            .single();

        if (workspaceError && workspaceError.code !== 'PGRST116') {
            console.error('Workspace check error:', workspaceError);
            return res.status(400).json({ error: 'Invalid workspace' });
        }

        // Insert into Supabase
        const { data: createdModel, error: insertError } = await supabase
            .from('ai_models')
            .insert([
                {
                    workspace_id: modelData.workspace_id,
                    name: modelData.name,
                    role: modelData.role,
                    personality: modelData.personality,
                    predefined: modelData.predefined,
                    topics: modelData.topics || [],
                    system_prompt: modelData.system_prompt || '',
                    custom_triggers: modelData.custom_triggers || [],
                    config: modelData.config || {},
                    is_active: modelData.is_active ?? true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return res.status(500).json({ error: insertError.message });
        }

        return res.status(201).json(createdModel);
    } catch (error) {
        console.error('Error creating AI model:', error);
        return res.status(500).json({ error: 'Failed to create AI model' });
    }
}
