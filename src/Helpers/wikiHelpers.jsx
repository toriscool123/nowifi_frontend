import { api } from '../api';


 // Skapar en ny wiki och lägger till eventuella användare och grupper som collaborators.
 
export async function createWikiWithOptions({ title, status, tags }, collaborators = [], groups = []) {
  //  Skapa wikin först för att få ett wiki_id
  const createRes = await api('w_wiki_create', 'POST', {
    title,
    status,
    tags,
  });

  if (!createRes.success) {
    throw new Error(createRes.error || 'Kunde inte skapa wikisidan.');
  }

  const wikiId = createRes.wiki_id;

  //  Lägg till valda användare som collaborators
  for (const username of collaborators) {
    try {
      await addWikiCollaborator(wikiId, username);
    } catch (err) {
      console.error(`Kunde inte lägga till användare ${username}:`, err);
    }
  }

  //  Lägg till valda grupper som collaborators
  for (const groupName of groups) {
    try {
      await addWikiGroupCollaborator(wikiId, groupName);
    } catch (err) {
      console.error(`Kunde inte lägga till grupp ${groupName}:`, err);
    }
  }

  return { success: true, wikiId };
}


 // Lägger till en enskild användare som collaborator på en wiki
 
export async function addWikiCollaborator(wikiId, username) {
  return await api('w_add_collaborator', 'POST', { wiki_id: wikiId, username });
}


 // Lägger till en hel grupp som collaborator på en wiki

export async function addWikiGroupCollaborator(wikiId, group) {
  return await api('w_add_group_collaborator', 'POST', { wiki_id: wikiId, group });
}

export async function removeWikiCollaborator(wikiId, username) {
  const response = await api('w_remove_collaborator', 'POST', {
    wiki_id: wikiId,
    username: username
  });
  return response;
}

export function canUserAccessWiki(wiki, currentUser) {
  if (!wiki) return false;
  if (!currentUser) return false;

  const role = String(currentUser.role || currentUser.user_role || '').toLowerCase();
  if (
    role === 'admin' ||
    role === 'superadmin' ||
    currentUser.is_admin === true ||
    currentUser.is_superadmin === true
  ) {
    return true;
  }

  const userId = currentUser.id ?? currentUser.user_id;
  const username = String(currentUser.username || currentUser.user_name || '').toLowerCase();

  // 1. Ägare / skapare av wikin
  const ownerId =
    wiki.owner_id ?? wiki.created_by ?? wiki.user_id ?? wiki.creator_id ?? wiki.owner?.id;
  if (userId !== undefined && ownerId !== undefined && String(ownerId) === String(userId)) {
    return true;
  }

  const ownerName = String(
    wiki.owner_username || wiki.created_by_name || wiki.owner?.username || ''
  ).toLowerCase();
  if (username && ownerName && ownerName === username) {
    return true;
  }

  // 2. Tydlig access-flagga från backend
  if (wiki.has_access === true || wiki.can_edit === true || wiki.is_member === true) {
    return true;
  }

  // 3. Lista med användare / medlemmar / behörigheter på wikin
  const memberLists = [
    wiki.users,
    wiki.members,
    wiki.allowed_users,
    wiki.permissions,
    wiki.access_list,
  ];

  for (const list of memberLists) {
    if (!Array.isArray(list)) continue;

    const match = list.some((entry) => {
      if (entry == null) return false;
      if (typeof entry === 'string' || typeof entry === 'number') {
        return (
          (userId !== undefined && String(entry) === String(userId)) ||
          (username && String(entry).toLowerCase() === username)
        );
      }
      const entryId = entry.id ?? entry.user_id;
      const entryName = String(entry.username || entry.user_name || '').toLowerCase();
      return (
        (userId !== undefined && entryId !== undefined && String(entryId) === String(userId)) ||
        (username && entryName && entryName === username)
      );
    });

    if (match) return true;
  }

  // 4. Om backend redan filtrerat och bara skickar tillåtna wikis utan specifika fält
  if (
    ownerId === undefined &&
    !Array.isArray(wiki.users) &&
    !Array.isArray(wiki.members) &&
    wiki.has_access === undefined &&
    wiki.can_edit === undefined
  ) {
    return true;
  }

  return false;
}

export function filterAccessibleWikis(wikis, currentUser) {
  if (!Array.isArray(wikis)) return [];
  return wikis.filter((wiki) => canUserAccessWiki(wiki, currentUser));
}