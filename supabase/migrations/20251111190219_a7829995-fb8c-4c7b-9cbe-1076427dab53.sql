-- Update the generate_tracking_code function to use AAAA000 format
CREATE OR REPLACE FUNCTION public.generate_tracking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  code text;
  exists_flag boolean;
  letters text;
  numbers text;
BEGIN
  LOOP
    -- Generate 4 random uppercase letters
    letters := '';
    FOR i IN 1..4 LOOP
      letters := letters || chr(65 + floor(random() * 26)::int);
    END LOOP;
    
    -- Generate 3 random digits
    numbers := '';
    FOR i IN 1..3 LOOP
      numbers := numbers || floor(random() * 10)::int;
    END LOOP;
    
    -- Combine letters and numbers
    code := letters || numbers;
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.reports WHERE tracking_code = code) INTO exists_flag;
    EXIT WHEN NOT exists_flag;
  END LOOP;
  
  RETURN code;
END;
$function$;