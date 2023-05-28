const { MongoClient } = require('mongodb');
const unzipper = require('unzipper');
const fs = require('fs');

const dotenv = require('dotenv');
dotenv.config();

// Configuration de l'archive ZIP
//get last version of backup par le date
const ArchiveFile = fs.readdirSync('backup').sort((a, b) => { return new Date(b.slice(7, 17)) - new Date(a.slice(7, 17)) })
console.log(ArchiveFile)
const inputZip = ArchiveFile[ArchiveFile.length - 1];
const inputDir = 'backup';

console.log('📍 Save selected : ' + inputZip)

const outputDir = 'extract';

async function main() {
    try {
        // Connexion à la base de données
        const client = await MongoClient.connect(process.env.DB_RESTORE_LINK, { useUnifiedTopology: true });
        const db = client.db();

        //check if output folder exists
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

        // Extraction de l'archive ZIP
        const stream = fs.createReadStream(inputDir + "/" + inputZip).pipe(unzipper.Extract({ path: outputDir }));

        stream.on('close', async () => {
            console.log('📬 Extraction de l\'archive terminée');

            // Parcours des fichiers extraits
            const collectionNames = fs.readdirSync(outputDir);

            for (const collectionName of collectionNames) {
                const documents = fs.readdirSync(`${outputDir}/${collectionName}`);

                console.log(`  🖍️ Restauration de la collection : ${collectionName} (${documents.length} documents)`);

                // Parcours des documents de la collection
                for (const documentName of documents) {
                    const documentPath = `${outputDir}/${collectionName}/${documentName}`;
                    const documentData = fs.readFileSync(documentPath, 'utf8');
                    const document = JSON.parse(documentData);

                    // Insertion ou mise à jour du document dans la base de données
                    await db.collection(collectionName).replaceOne({ _id: document._id }, document, { upsert: true });
                    console.log(`    - Document restauré : ${collectionName}/${document._id}`);
                }
            }

            // Suppression du dossier extrait
            fs.rmdirSync(outputDir, { recursive: true });

            console.log('✨ Restauration terminée');
            client.close();
        });
    } catch (error) {
        console.error('\n\n❌ Une erreur s\'est produite :', error);
    }
}

main();
