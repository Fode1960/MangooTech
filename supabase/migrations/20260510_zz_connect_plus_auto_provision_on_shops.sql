CREATE OR REPLACE FUNCTION public.connect_plus_provision_for_shop_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_slug TEXT;
  v_pin TEXT;
  v_token TEXT;
  v_try INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_slug := lower(COALESCE(NEW.slug, ''));
  IF v_slug = '' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.connect_plus_entries e
    WHERE e.shop_slug = v_slug AND e.is_active = TRUE
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  v_expires_at := NOW() + INTERVAL '72 hours';

  FOR v_try IN 1..50 LOOP
    v_pin := lpad((floor(random() * 1000000))::int::text, 6, '0');
    v_token := encode(gen_random_bytes(16), 'hex');
    BEGIN
      INSERT INTO public.connect_plus_entries (shop_slug, pin, token, is_active, expires_at)
      VALUES (v_slug, v_pin, v_token, TRUE, v_expires_at);
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connect_plus_provision_on_shops_insert ON public.shops;
CREATE TRIGGER trg_connect_plus_provision_on_shops_insert
AFTER INSERT ON public.shops
FOR EACH ROW
EXECUTE FUNCTION public.connect_plus_provision_for_shop_insert();
