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