// Friends surface: reads under RLS, writes through db-social.
import {supabase} from "./client.js";
import {createEdgeInvoker, currentUserId} from "../lib/database.js";

const invoke = createEdgeInvoker("db-social");

export const requestFriend = (username) => invoke({action: "request", username});
export const acceptFriend = (id) => invoke({action: "accept", id});
export const removeFriend = (id) => invoke({action: "remove", id});

// All friendship rows touching me, with the far side's profile resolved so
// callers never join again. Shape:
// {id, status, direction: 'in'|'out', other: {id, username, last_seen}}
// direction is relative to me: 'out' when I sent the request, 'in' when I
// received it, which is how a pending row knows whether to offer Accept or
// Cancel. other.last_seen backs the "last online" readout for an offline friend.
export async function fetchFriends() {
    const uid = await currentUserId();
    if (!uid) return [];
    const {data} = await supabase
        .from("friendships")
        .select(
            "id, status, requester, addressee, req:profiles!friendships_requester_fkey(id, username, last_seen), add:profiles!friendships_addressee_fkey(id, username, last_seen)",
        );
    return (data ?? []).map((f) => {
        const out = f.requester === uid;
        const other = out ? f.add : f.req;
        return {id: f.id, status: f.status, direction: out ? "out" : "in", other};
    });
}
