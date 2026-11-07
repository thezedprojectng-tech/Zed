-- 0034_enforce_dob_on_signup.sql  (run AFTER the code deploy and after 0033)
-- The live trigger on_auth_user_created runs public.handle_new_user().
-- Body = the live definition plus the DOB checks only.
-- ROLLBACK: re-create handle_new_user() with the body that has no DOB logic
-- (insert into public.users (id, full_name, phone_number) only).

BEGIN;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_dob_raw   text;
  v_dob       date;
  v_dob_check text;
begin
  v_dob_raw := new.raw_user_meta_data->>'date_of_birth';

  if v_dob_raw is null or trim(v_dob_raw) = '' then
    raise exception 'Date of birth is required' using errcode = '22023';
  end if;

  begin
    v_dob := v_dob_raw::date;
  exception when others then
    raise exception 'Invalid date of birth' using errcode = '22023';
  end;

  v_dob_check := public.is_valid_dob(v_dob);
  if v_dob_check = 'underage' then
    raise exception 'You must be at least % to create a Zed account.', public.zed_min_age()
      using errcode = '22023';
  elsif v_dob_check is not null then
    raise exception 'Invalid date of birth' using errcode = '22023';
  end if;

  insert into public.users (id, full_name, phone_number, date_of_birth)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Zed user'),
    new.raw_user_meta_data->>'phone_number',
    v_dob
  );
  return new;
end;
$function$;

COMMIT;