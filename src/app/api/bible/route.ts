import { NextRequest } from 'next/server';
import { BibleService } from '@/lib/bible/service';

const bibleService = new BibleService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'books': {
        const testament = searchParams.get('testament') as 'old' | 'new' | null;
        const books = await bibleService.getBooks(testament || undefined);
        return Response.json({ books });
      }
      case 'translations': {
        const translations = await bibleService.getTranslations();
        return Response.json({ translations });
      }
      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
