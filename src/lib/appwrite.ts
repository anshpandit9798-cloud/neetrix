import { Client, Account, Databases } from "appwrite";

let clientInstance: Client | null = null;
let accountInstance: Account | null = null;
let databasesInstance: Databases | null = null;

export interface AppwriteKeys {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
  isEnv: boolean;
}

export function getAppwriteKeys(): AppwriteKeys {
  const envEndpoint = (import.meta as any).env?.VITE_APPWRITE_ENDPOINT;
  const envProject = (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID;
  const envDatabase = (import.meta as any).env?.VITE_APPWRITE_DATABASE_ID;
  const envCollection = (import.meta as any).env?.VITE_APPWRITE_COLLECTION_ID;

  const localEndpoint = localStorage.getItem("APPWRITE_ENDPOINT");
  const localProject = localStorage.getItem("APPWRITE_PROJECT_ID");
  const localDatabase = localStorage.getItem("APPWRITE_DATABASE_ID");
  const localCollection = localStorage.getItem("APPWRITE_COLLECTION_ID");

  return {
    endpoint: envEndpoint || localEndpoint || "https://cloud.appwrite.io/v1",
    projectId: envProject || localProject || "",
    databaseId: envDatabase || localDatabase || "",
    collectionId: envCollection || localCollection || "",
    isEnv: !!envProject
  };
}

export function initAppwrite(endpoint: string, projectId: string, databaseId: string, collectionId: string): Client | null {
  if (projectId) {
    const finalEndpoint = endpoint.trim() || "https://cloud.appwrite.io/v1";
    localStorage.setItem("APPWRITE_ENDPOINT", finalEndpoint);
    localStorage.setItem("APPWRITE_PROJECT_ID", projectId.trim());
    localStorage.setItem("APPWRITE_DATABASE_ID", databaseId.trim());
    localStorage.setItem("APPWRITE_COLLECTION_ID", collectionId.trim());

    clientInstance = new Client()
      .setEndpoint(finalEndpoint)
      .setProject(projectId.trim());

    accountInstance = new Account(clientInstance);
    databasesInstance = new Databases(clientInstance);
    return clientInstance;
  }
  return null;
}

export function getAppwriteClient(): Client | null {
  const { endpoint, projectId } = getAppwriteKeys();
  if (!projectId) {
    clientInstance = null;
    return null;
  }
  if (clientInstance) return clientInstance;

  try {
    clientInstance = new Client()
      .setEndpoint(endpoint || "https://cloud.appwrite.io/v1")
      .setProject(projectId);
    return clientInstance;
  } catch (e) {
    console.error("Failed to initialize Appwrite client", e);
  }
  return null;
}

export function getAppwriteAccount(): Account | null {
  const client = getAppwriteClient();
  if (!client) {
    accountInstance = null;
    return null;
  }
  if (accountInstance) return accountInstance;
  accountInstance = new Account(client);
  return accountInstance;
}

export function getAppwriteDatabases(): Databases | null {
  const client = getAppwriteClient();
  if (!client) {
    databasesInstance = null;
    return null;
  }
  if (databasesInstance) return databasesInstance;
  databasesInstance = new Databases(client);
  return databasesInstance;
}
