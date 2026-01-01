-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_sessions (
  id integer NOT NULL DEFAULT nextval('admin_sessions_id_seq'::regclass),
  user_id integer NOT NULL,
  token character varying NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id)
);
CREATE TABLE public.admin_users (
  id integer NOT NULL DEFAULT nextval('admin_users_id_seq'::regclass),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying,
  is_active boolean DEFAULT true,
  role character varying DEFAULT 'editor'::character varying CHECK (role::text = ANY (ARRAY['viewer'::character varying, 'editor'::character varying, 'admin'::character varying]::text[])),
  last_login timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.api_requests (
  id integer NOT NULL DEFAULT nextval('api_requests_id_seq'::regclass),
  ip_address character varying NOT NULL,
  endpoint character varying NOT NULL,
  method character varying NOT NULL,
  status_code integer,
  request_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT api_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.author_translations (
  id integer NOT NULL DEFAULT nextval('author_translations_id_seq'::regclass),
  author_id integer NOT NULL,
  language character varying NOT NULL,
  name character varying NOT NULL,
  bio text,
  CONSTRAINT author_translations_pkey PRIMARY KEY (id),
  CONSTRAINT author_translations_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id)
);
CREATE TABLE public.authors (
  id integer NOT NULL DEFAULT nextval('authors_id_seq'::regclass),
  slug character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT authors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.biblical_references (
  id integer NOT NULL DEFAULT nextval('biblical_references_id_seq'::regclass),
  devotional_id integer NOT NULL,
  book character varying NOT NULL,
  chapter integer NOT NULL,
  verse_start integer,
  verse_end integer,
  reference_text character varying NOT NULL,
  sort_order integer DEFAULT 0,
  scripture_text jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT biblical_references_pkey PRIMARY KEY (id),
  CONSTRAINT biblical_references_devotional_id_fkey FOREIGN KEY (devotional_id) REFERENCES public.devotionals(id)
);
CREATE TABLE public.devon_ai_conversations (
  id integer NOT NULL DEFAULT nextval('devon_ai_conversations_id_seq'::regclass),
  user_id integer NOT NULL,
  title character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT devon_ai_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT devon_ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id)
);
CREATE TABLE public.devon_ai_messages (
  id integer NOT NULL DEFAULT nextval('devon_ai_messages_id_seq'::regclass),
  conversation_id integer NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['user'::character varying, 'assistant'::character varying]::text[])),
  content text NOT NULL,
  function_calls jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT devon_ai_messages_pkey PRIMARY KEY (id),
  CONSTRAINT devon_ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.devon_ai_conversations(id)
);
CREATE TABLE public.devotional_contents (
  id integer NOT NULL DEFAULT nextval('devotional_contents_id_seq'::regclass),
  devotional_id integer NOT NULL,
  language character varying NOT NULL,
  title character varying NOT NULL,
  teaching_content text NOT NULL,
  closing_prayer text NOT NULL,
  quote_author text,
  quote_text text,
  opening_inspiration text,
  action_step text,
  reflection_questions jsonb DEFAULT '[]'::jsonb,
  scripture_reference text,
  CONSTRAINT devotional_contents_pkey PRIMARY KEY (id),
  CONSTRAINT devotional_contents_devotional_id_fkey FOREIGN KEY (devotional_id) REFERENCES public.devotionals(id)
);
CREATE TABLE public.devotionals (
  id integer NOT NULL DEFAULT nextval('devotionals_id_seq'::regclass),
  slug character varying NOT NULL UNIQUE,
  author_id integer,
  theme_id integer,
  publish_date date NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  day_number integer,
  estimated_duration_minutes integer DEFAULT 10,
  tags ARRAY DEFAULT '{}'::text[],
  CONSTRAINT devotionals_pkey PRIMARY KEY (id),
  CONSTRAINT devotionals_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.authors(id),
  CONSTRAINT devotionals_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);
CREATE TABLE public.theme_translations (
  id integer NOT NULL DEFAULT nextval('theme_translations_id_seq'::regclass),
  theme_id integer NOT NULL,
  language character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  CONSTRAINT theme_translations_pkey PRIMARY KEY (id),
  CONSTRAINT theme_translations_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);
CREATE TABLE public.themes (
  id integer NOT NULL DEFAULT nextval('themes_id_seq'::regclass),
  slug character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT themes_pkey PRIMARY KEY (id)
);