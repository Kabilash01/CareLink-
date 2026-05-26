create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_age smallint;
begin
  if (new.raw_user_meta_data->>'age') ~ '^[0-9]+$' then
    profile_age := (new.raw_user_meta_data->>'age')::smallint;
  else
    profile_age := null;
  end if;

  insert into public.profiles (id, full_name, phone, age, gender)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', ''),
    profile_age,
    nullif(new.raw_user_meta_data->>'gender', '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    age = excluded.age,
    gender = excluded.gender,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
