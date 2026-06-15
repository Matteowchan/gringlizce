-- ============================================================================
-- CONSUME_AI_QUOTA RPC
-- ============================================================================
-- Edge Function (gri-ask) tarafından çağrılır. Atomik olarak:
-- 1. ai_quota satırını FOR UPDATE ile kilitler (race condition korumalı)
-- 2. Kalan hak var mı kontrol eder
-- 3. Varsa used_count'u artırır ve TRUE döner
-- 4. Yoksa FALSE döner, satır değişmez
-- ============================================================================

CREATE OR REPLACE FUNCTION public.consume_ai_quota(p_user_id UUID)
RETURNS TABLE(success BOOLEAN, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_used INTEGER;
BEGIN
  SELECT total_quota, used_count INTO v_total, v_used
  FROM public.ai_quota
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Satır yok, default 5 ile yarat
    INSERT INTO public.ai_quota (user_id, total_quota, used_count)
    VALUES (p_user_id, 5, 1)
    ON CONFLICT (user_id) DO UPDATE SET used_count = ai_quota.used_count + 1;

    RETURN QUERY SELECT TRUE, 4;
    RETURN;
  END IF;

  IF v_used >= v_total THEN
    RETURN QUERY SELECT FALSE, 0;
    RETURN;
  END IF;

  UPDATE public.ai_quota
  SET used_count = used_count + 1, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT TRUE, (v_total - v_used - 1);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(UUID) TO service_role;

-- Test
-- SELECT * FROM public.consume_ai_quota('YOUR_USER_ID_HERE');
