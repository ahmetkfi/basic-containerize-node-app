const notebooksDbUser=process.env.NOTEBOOKS_DB_USER;
const notebooksDbPassword= process.env.NOTEBOOKS_DB_PASSWORD;
const notebooksDbName = process.env.NOTEBOOKS_DB_NAME 

console.log("INITIALIZIN : Notebooks DB User" + notebooksDbUser);

db=db.getSiblingDB(notebooksDbName);

db.createUser({
  user: notebooksDbUser,
  pwd: notebooksDbPassword,
  roles: [
    {
      role: "readWrite",
      db: notebooksDbName,
    },
  ],
});

