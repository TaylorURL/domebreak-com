-- Client roles read through row-level security and write through nothing.
--
-- Every write in DomeBreak goes through an edge function holding the service
-- role: the client library only ever selects. The table grants did not say so.
-- anon and authenticated held INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES and
-- TRIGGER on all twelve relations in `public`, and RLS was the only thing
-- standing between an anon key and the rows. That holds for the three commands
-- RLS filters and does not hold for TRUNCATE, which is a table-level privilege
-- no policy is consulted for.
--
-- Grants and policies answer different questions. A policy says which rows a
-- statement may touch; a grant says whether the statement may run at all. A
-- table whose write path is a service-role function needs neither the policy
-- nor the grant, so the grant comes off and RLS stops being the only lock.
--
-- SELECT stays. The read policies already scope it to the signed-in user.

revoke insert, update, delete, truncate, references, trigger
    on all tables in schema public
    from anon, authenticated;

-- New tables inherited the same grants: the project's default privileges hand
-- anon and authenticated everything on any table created in `public`, so the
-- revoke above would last exactly until the next migration added a table.
alter default privileges in schema public
    revoke insert, update, delete, truncate, references, trigger
    on tables from anon, authenticated;

-- handle_new_user and rls_auto_enable return trigger and event_trigger. Neither
-- can be reached over PostgREST and neither is called by name, so no client role
-- needs EXECUTE; the trigger fires under the role performing the insert.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- is_party_member is read inside the parties and party_members policies, which
-- are evaluated as the querying role, so authenticated keeps EXECUTE. anon is
-- never a party member and has no policy that consults it.
revoke execute on function public.is_party_member(uuid) from public, anon;
grant execute on function public.is_party_member(uuid) to authenticated, service_role;
