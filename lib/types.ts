export type Notification = {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  readBy?: string[];
};
