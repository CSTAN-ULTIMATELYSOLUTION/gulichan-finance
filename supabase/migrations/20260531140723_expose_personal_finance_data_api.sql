ALTER ROLE authenticator SET pgrst.db_schemas = 'public,storage,graphql_public,miniapp,personal_finance';

NOTIFY pgrst, 'reload config';
