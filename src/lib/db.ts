import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

export interface Project {
  id?: string;
  name: string;
  description: string;
  color: string;
  workspaceId: string;
  createdAt: any;
  status: 'active' | 'archived';
}

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  workspaceId: string;
  assigneeId?: string;
  startDate?: string;
  deliveryDate?: string;
  dueDate?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Workspace {
  id?: string;
  name: string;
  ownerId: string;
  createdAt: any;
}

export interface Member {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
  status: 'active' | 'invited';
  availability?: 'available' | 'unavailable';
  createdAt: any;
}

// Workspace Services
// User Services
export async function updateUserProfile(uid: string, data: any) {
  try {
    await updateDoc(doc(db, 'users', uid), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// Workspace Services
export async function updateWorkspace(id: string, data: any) {
  try {
    await updateDoc(doc(db, 'workspaces', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `workspaces/${id}`);
  }
}

export async function getWorkspaces(userId: string) {
  const q = query(collection(db, 'workspaces'), where('ownerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Workspace[];
}

export async function createWorkspace(data: any) {
  try {
    const docRef = await addDoc(collection(db, 'workspaces'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'workspaces');
  }
}

// Project Services
export function subscribeProjects(workspaceId: string, callback: (projects: Project[]) => void) {
  const q = query(
    collection(db, 'projects'), 
    where('workspaceId', '==', workspaceId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];
    callback(projects);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  });
}

export async function createProject(data: Partial<Project>) {
  try {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...data,
      status: 'active',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'projects');
  }
}

export async function updateProject(id: string, data: Partial<Project>) {
  try {
    await updateDoc(doc(db, 'projects', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
  }
}

export async function deleteProject(id: string) {
  try {
    await updateDoc(doc(db, 'projects', id), { status: 'archived' });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
  }
}

// Task Services
export function subscribeTasks(projectId: string, callback: (tasks: Task[]) => void) {
  const q = query(
    collection(db, 'tasks'), 
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  });
}

export function subscribeWorkspaceTasks(workspaceId: string, callback: (tasks: Task[]) => void) {
  const q = query(
    collection(db, 'tasks'), 
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  });
}

export async function createTask(data: Partial<Task>) {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'tasks');
  }
}

export async function updateTask(id: string, data: Partial<Task>) {
  try {
    await updateDoc(doc(db, 'tasks', id), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
  }
}

export async function deleteTask(id: string) {
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${id}`);
  }
}

// Member Services
export function subscribeMembers(workspaceId: string, callback: (members: Member[]) => void) {
  const q = query(
    collection(db, 'workspaces', workspaceId, 'members'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[]);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, `workspaces/${workspaceId}/members`);
  });
}

export async function inviteMember(workspaceId: string, email: string, name: string, role: Member['role'] = 'member') {
  try {
    await addDoc(collection(db, 'workspaces', workspaceId, 'members'), {
      email,
      name,
      role,
      status: 'invited',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `workspaces/${workspaceId}/members`);
  }
}

export async function deleteMember(workspaceId: string, memberId: string) {
  try {
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'members', memberId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `workspaces/${workspaceId}/members/${memberId}`);
  }
}

export async function updateMember(workspaceId: string, memberId: string, data: Partial<Member>) {
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId, 'members', memberId), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `workspaces/${workspaceId}/members/${memberId}`);
  }
}

export interface Channel {
  id?: string;
  name: string;
  type: 'public' | 'private' | 'dm';
  workspaceId: string;
  memberIds?: string[];
  createdAt: any;
}

export interface Message {
  id?: string;
  content: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  channelId: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  createdAt: any;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  link?: string;
  createdAt: any;
}

// Channel Services
export function subscribeChannels(workspaceId: string, callback: (channels: Channel[]) => void) {
  const q = query(
    collection(db, 'channels'),
    where('workspaceId', '==', workspaceId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Channel[]);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'channels'));
}

export async function createChannel(data: Partial<Channel>) {
  try {
    const docRef = await addDoc(collection(db, 'channels'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'channels');
  }
}

export async function getOrCreateDMChannel(workspaceId: string, myId: string, otherId: string, otherName: string) {
  try {
    // Try to find existing DM channel
    const q = query(
      collection(db, 'channels'),
      where('workspaceId', '==', workspaceId),
      where('type', '==', 'dm'),
      where('memberIds', 'array-contains', myId)
    );
    
    const snapshot = await getDocs(q);
    const existing = snapshot.docs.find(doc => {
      const data = doc.data();
      return data.memberIds && data.memberIds.includes(otherId);
    });

    if (existing) {
      return existing.id;
    }

    // Create new DM channel
    return await createChannel({
      name: `DM: ${otherName}`,
      type: 'dm',
      workspaceId,
      memberIds: [myId, otherId]
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'channels dm');
  }
}

// Message Services
export function subscribeMessages(channelId: string, callback: (messages: Message[]) => void) {
  const q = query(
    collection(db, 'messages'),
    where('channelId', '==', channelId),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[]);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'messages'));
}

export async function sendMessage(data: Partial<Message>) {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'messages');
  }
}

// Notification Services
export function subscribeNotifications(userId: string, callback: (notifications: Notification[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[]);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'notifications'));
}

export async function createNotification(data: Partial<Notification>) {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...data,
      read: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'notifications');
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
  }
}
