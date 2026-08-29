import fs from "fs";
import path from "path";
import os from "os";

function getStoragePath(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    const dir = path.join(appData, "AnimeRealms");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "local_db.json");
  } else {
    const home = os.homedir();
    const dir = path.join(home, ".animerealms");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "local_db.json");
  }
}

interface LocalDBData {
  [collectionName: string]: any[];
}

class LocalDB {
  private filePath: string;
  private data: LocalDBData = {};
  private loaded = false;

  constructor() {
    this.filePath = getStoragePath();
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.data = {};
        this.save();
      }
    } catch (e) {
      console.warn("[LocalDB] Failed to read database file, initializing empty:", e);
      this.data = {};
    }
    this.loaded = true;
  }

  private save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("[LocalDB] Failed to save database file:", e);
    }
  }

  public db(_dbName?: string) {
    return this;
  }

  public collection(name: string) {
    if (!this.data[name]) {
      this.data[name] = [];
    }

    return {
      findOne: async (filter: Record<string, any>) => {
        this.load();
        const curItems = this.data[name] || [];
        return (
          curItems.find((item) => {
            return Object.entries(filter).every(([k, v]) => item[k] === v);
          }) || null
        );
      },

      find: (filter: Record<string, any> = {}) => {
        this.load();
        const curItems = this.data[name] || [];
        const filtered = curItems.filter((item) => {
          return Object.entries(filter).every(([k, v]) => item[k] === v);
        });
        return {
          toArray: async () => filtered,
          sort: () => ({ toArray: async () => filtered }),
          limit: (n: number) => ({ toArray: async () => filtered.slice(0, n) }),
        };
      },

      insertOne: async (doc: any) => {
        this.load();
        if (!this.data[name]) this.data[name] = [];
        if (doc._id) {
          const existingIdx = this.data[name].findIndex((i) => i._id === doc._id);
          if (existingIdx !== -1) {
            this.data[name][existingIdx] = { ...doc };
            this.save();
            return { insertedId: doc._id };
          }
        }
        this.data[name].push({ ...doc });
        this.save();
        return { insertedId: doc._id || Date.now().toString() };
      },

      updateOne: async (
        filter: Record<string, any>,
        update: Record<string, any>,
        options: { upsert?: boolean } = {}
      ) => {
        this.load();
        if (!this.data[name]) this.data[name] = [];
        let index = this.data[name].findIndex((item) => {
          return Object.entries(filter).every(([k, v]) => item[k] === v);
        });

        if (index === -1) {
          if (options.upsert) {
            let newDoc = { ...filter };
            if (update.$setOnInsert) {
              newDoc = { ...newDoc, ...update.$setOnInsert };
            }
            if (update.$set) {
              newDoc = applyNestedSet(newDoc, update.$set);
            }
            if (update.$push) {
              newDoc = applyNestedPush(newDoc, update.$push);
            }
            this.data[name].push(newDoc);
            this.save();
            return { matchedCount: 0, modifiedCount: 1, upsertedId: newDoc._id };
          }
          return { matchedCount: 0, modifiedCount: 0 };
        }

        let doc = this.data[name][index];

        if (update.$pull) {
          doc = applyNestedPull(doc, update.$pull);
        }
        if (update.$set) {
          doc = applyNestedSet(doc, update.$set);
        }
        if (update.$push) {
          doc = applyNestedPush(doc, update.$push);
        }

        this.data[name][index] = doc;
        this.save();
        return { matchedCount: 1, modifiedCount: 1 };
      },

      updateMany: async (
        filter: Record<string, any>,
        update: Record<string, any>
      ) => {
        this.load();
        if (!this.data[name]) return { matchedCount: 0, modifiedCount: 0 };
        let modifiedCount = 0;
        this.data[name] = this.data[name].map((item) => {
          if (Object.entries(filter).every(([k, v]) => item[k] === v)) {
            let doc = { ...item };
            if (update.$set) doc = applyNestedSet(doc, update.$set);
            if (update.$push) doc = applyNestedPush(doc, update.$push);
            if (update.$pull) doc = applyNestedPull(doc, update.$pull);
            modifiedCount++;
            return doc;
          }
          return item;
        });
        if (modifiedCount > 0) this.save();
        return { matchedCount: modifiedCount, modifiedCount };
      },

      deleteOne: async (filter: Record<string, any>) => {
        this.load();
        if (!this.data[name]) return { deletedCount: 0 };
        const initialLen = this.data[name].length;
        this.data[name] = this.data[name].filter((item) => {
          return !Object.entries(filter).every(([k, v]) => item[k] === v);
        });
        const deletedCount = initialLen - this.data[name].length;
        if (deletedCount > 0) this.save();
        return { deletedCount };
      },

      deleteMany: async (filter: Record<string, any> = {}) => {
        this.load();
        if (!this.data[name]) return { deletedCount: 0 };
        const initialLen = this.data[name].length;
        this.data[name] = this.data[name].filter((item) => {
          return !Object.entries(filter).every(([k, v]) => item[k] === v);
        });
        const deletedCount = initialLen - this.data[name].length;
        if (deletedCount > 0) this.save();
        return { deletedCount };
      },

      countDocuments: async (filter: Record<string, any> = {}) => {
        this.load();
        const curItems = this.data[name] || [];
        return curItems.filter((item) => {
          return Object.entries(filter).every(([k, v]) => item[k] === v);
        }).length;
      },
    };
  }
}


function applyNestedSet(doc: any, setObj: Record<string, any>): any {
  const result = { ...doc };
  for (const [key, value] of Object.entries(setObj)) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let curr = result;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]] || typeof curr[parts[i]] !== "object") {
          curr[parts[i]] = {};
        }
        curr = curr[parts[i]];
      }
      curr[parts[parts.length - 1]] = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function applyNestedPush(doc: any, pushObj: Record<string, any>): any {
  const result = { ...doc };
  for (const [key, pushVal] of Object.entries(pushObj)) {
    let arr = Array.isArray(result[key]) ? [...result[key]] : [];
    if (pushVal && pushVal.$each && Array.isArray(pushVal.$each)) {
      arr.push(...pushVal.$each);
      if (typeof pushVal.$slice === "number" && pushVal.$slice < 0) {
        arr = arr.slice(pushVal.$slice);
      }
    } else {
      arr.push(pushVal);
    }
    result[key] = arr;
  }
  return result;
}

function applyNestedPull(doc: any, pullObj: Record<string, any>): any {
  const result = { ...doc };
  for (const [key, pullCond] of Object.entries(pullObj)) {
    if (Array.isArray(result[key])) {
      result[key] = result[key].filter((item: any) => {
        if (typeof pullCond === "object" && pullCond !== null) {
          return !Object.entries(pullCond).every(([pk, pv]) => item[pk] === pv);
        }
        return item !== pullCond;
      });
    }
  }
  return result;
}

export const localDbInstance = new LocalDB();
