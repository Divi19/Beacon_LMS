SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'lms_schema';


SELECT 
    table_schema,
    table_name,
    row_count
FROM (
    SELECT 
        table_schema,
        table_name,
        (xpath('/row/cnt/text()', xml_count))[1]::text::int AS row_count
    FROM (
        SELECT 
            table_schema,
            table_name,
            query_to_xml(
                format('SELECT COUNT(*) AS cnt FROM %I.%I', table_schema, table_name),
                false, true, ''
            ) AS xml_count
        FROM information_schema.tables
        WHERE table_schema = 'lms_schema'
          AND table_type = 'BASE TABLE'
    ) t
) counts;



