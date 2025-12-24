WITH new_co AS (
  INSERT INTO public.companies (company_name, owner_email, email, role)
  VALUES ('Afrikoni Outlook Test Company', 'afrikoni@outlook.com', 'afrikoni@outlook.com', 'seller')
  RETURNING id
)
UPDATE public.profiles p
SET company_id = new_co.id,
    role       = 'seller'
FROM new_co
WHERE p.email = 'afrikoni@outlook.com';

