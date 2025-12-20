import { NextRequest, NextResponse } from 'next/server';

const ZERODB_API_KEY = process.env.ZERODB_API_KEY;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID || 'e7b115fd-234b-4892-95df-47fd53807f74';

// Store messages in ZeroDB
export async function POST(req: NextRequest) {
  try {
    const { action, conversationId, messages } = await req.json();

    if (action === 'store') {
      console.log('Storing conversation:', conversationId, 'with', messages.length, 'messages');

      // Store all messages for a conversation
      const storePromises = messages.map((msg: any) =>
        fetch(`https://api.ainative.studio/v1/public/${ZERODB_PROJECT_ID}/database/memory`, {
          method: 'POST',
          headers: {
            'X-API-Key': ZERODB_API_KEY!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: conversationId,
            agent_id: 'transmutes_chatbot',
            role: msg.role,
            content: msg.content,
            metadata: {
              message_id: msg.id,
              timestamp: new Date().toISOString(),
            },
          }),
        }).then(res => res.json())
      );

      const results = await Promise.all(storePromises);
      console.log('Stored messages:', results);

      return NextResponse.json({ success: true, count: messages.length });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('ZeroDB conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to process conversation', details: String(error) },
      { status: 500 }
    );
  }
}

// Get all messages for a conversation using the memory search endpoint
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    console.log('Loading conversation:', conversationId);

    // Use the memory endpoint to list all memories for this session
    // First, try to get memories using a broad search filtered by session_id
    const response = await fetch(
      `https://api.ainative.studio/v1/public/${ZERODB_PROJECT_ID}/database/memory`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': ZERODB_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ZeroDB API error:', response.status, errorText);
      return NextResponse.json({ messages: [] }); // Return empty array on error
    }

    const data = await response.json();
    console.log('Retrieved all memories, filtering for session:', conversationId);

    // Filter memories by session_id
    const sessionMemories = (data.memories || [])
      .filter((item: any) => item.session_id === conversationId)
      .sort((a: any, b: any) => {
        // Sort by timestamp or creation order
        const timeA = new Date(a.created_at || a.metadata?.timestamp || 0).getTime();
        const timeB = new Date(b.created_at || b.metadata?.timestamp || 0).getTime();
        return timeA - timeB;
      });

    console.log('Found memories for session:', sessionMemories.length);

    // Transform ZeroDB memory format back to message format
    const messages = sessionMemories.map((item: any) => ({
      id: item.metadata?.message_id || item.id || crypto.randomUUID(),
      role: item.role,
      content: item.content,
    }));

    console.log('Returning messages:', messages.length);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('ZeroDB fetch error:', error);
    return NextResponse.json(
      { messages: [], error: 'Failed to fetch conversation', details: String(error) },
      { status: 200 } // Return 200 with empty array so UI doesn't break
    );
  }
}
