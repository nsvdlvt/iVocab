create or replace function public.flatten_reading_content(content jsonb, value_key text)
returns jsonb
language plpgsql
as $$
declare
  result jsonb := jsonb_build_object('paragraphs', '[]'::jsonb);
  paragraphs jsonb := '[]'::jsonb;
  section jsonb;
  paragraph jsonb;
  section_paragraphs jsonb;
  paragraph_text text;
begin
  if content is null or jsonb_typeof(content) <> 'object' then
    return jsonb_build_object('paragraphs', '[]'::jsonb);
  end if;

  if content ? 'paragraphs' then
    return jsonb_build_object(
      'paragraphs',
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', paragraph_item->>'id',
              'text', paragraph_item->>'text',
              'highlighted_words', paragraph_item->'highlighted_words'
            )
          )
          from jsonb_array_elements(coalesce(content->'paragraphs', '[]'::jsonb)) as paragraph_item
        ),
        '[]'::jsonb
      )
    );
  end if;

  for section in select * from jsonb_array_elements(coalesce(content->'sections', '[]'::jsonb)) loop
    section_paragraphs := coalesce(section->'paragraphs', '[]'::jsonb);
    for paragraph in select * from jsonb_array_elements(section_paragraphs) loop
      paragraph_text := coalesce(paragraph->>value_key, paragraph->>'text', '');
      paragraphs := paragraphs || jsonb_build_array(
        jsonb_build_object(
          'id', paragraph->>'id',
          'text', paragraph_text,
          'highlighted_words', paragraph->'highlighted_words'
        )
      );
    end loop;
  end loop;

  result := jsonb_build_object('paragraphs', paragraphs);
  return result;
end;
$$;

update public.reading_articles
set
  english_content = public.flatten_reading_content(english_content, 'english'),
  vietnamese_content = public.flatten_reading_content(vietnamese_content, 'vietnamese'),
  updated_at = timezone('utc'::text, now())
where english_content ? 'sections'
   or vietnamese_content ? 'sections';

drop function if exists public.flatten_reading_content(jsonb, text);
