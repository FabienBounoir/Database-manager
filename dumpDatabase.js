const { MongoClient } = require('mongodb');
const archiver = require('archiver');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

// Configuration de l'archive ZIP
const outputZip = `backup-${new Date().toISOString()}.zip`; //.slice(0, 10)
const outputDir = 'backup';

async function main() {
    try {
        // Connexion à la base de données
        const client = await MongoClient.connect(process.env.DB_DUMP_LINK, { useUnifiedTopology: true });
        const db = client.db();

        // Récupération de la liste des collections
        const collectionNames = await db.listCollections().toArray();

        //check if backup folder exists
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        // Création de l'archive ZIP
        const output = fs.createWriteStream(outputDir + '/' + outputZip);
        const archive = archiver('zip');

        output.on('close', () => {
            console.log(`✨ Archive créée : ${archive.pointer()} octets`);
            client.close().catch(console.error);
        });

        archive.pipe(output);

        // Parcours de chaque collection et ajout des documents à l'archive
        for (const collection of collectionNames) {
            const cursor = db.collection(collection.name).find();

            await cursor.forEach((document) => {
                const collectionName = collection.name;
                const documentName = document._id.toString();

                // Ajout du document à l'archive
                archive.append(JSON.stringify(document), { name: `${collectionName}/${documentName}.json` });
            });
        }

        // Finalisation de l'archive
        archive.finalize();

        //Garde les 10 dernieres archives en fonction de la date
        const files = fs.readdirSync(outputDir);
        const sortedFiles = files.sort((a, b) => {
            const dateA = new Date(a.slice(7, 17));
            const dateB = new Date(b.slice(7, 17));
            return dateA - dateB;
        });

        if (sortedFiles.length > (process.env.MAX_OLD_SAVE || 5)) {
            const fileToDelete = sortedFiles[0];
            fs.unlinkSync(outputDir + '/' + fileToDelete);
        }

    } catch (error) {
        console.error('\n\n❌ Une erreur s\'est produite :', error);
    }
}

main();
