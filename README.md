
# Database-manager

Script for managing backups in mongo DBs


## Documentation

You can use cronTab to automate the backup of your database:

```
0 2 * * * /chemin/vers/node /chemin/vers/dumpDatabase.js
```




## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DB_DUMP_LINK` : The database to be extracted

`DB_RESTORE_LINK` : The database has or must be relocated the backup

`MAX_OLD_SAVE` : Number of old back-ups to keep



