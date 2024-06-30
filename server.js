const http = require('http');
const fs = require('fs');
const path = require('path');
const { usagersData } = require('./liste_usagers');

const port = process.env.PORT || 8000;

/**
 * Lit et envoie une page web au client.
 * @param {string} fileName - Nom du fichier à envoyer.
 * @param {object} reponse - Objet de réponse HTTP.
 */
function fournirPageWeb(fileName, reponse) {
    fs.readFile(fileName, 'utf8', (err, data) => {
        if (err) {
            console.log(`Erreur lors de la lecture du fichier ${fileName}:`, err);
            reponse.writeHead(404, { 'Content-Type': 'text/plain' });
            reponse.end('Page non trouvée');
            return;
        }
        reponse.writeHead(200, { 'Content-Type': 'text/html' });
        reponse.end(data);
    });
}

/**
 * Traite la requête en validant le login et le mot de passe, puis renvoie la page correspondante.
 * @param {URLSearchParams} params - Paramètres de la requête.
 * @param {object} reponse - Objet de réponse HTTP.
 */
function traiteRequete(params, reponse) {
    const login = params.get('login');
    const pwd = params.get('pwd');

    console.log('Login:', login);
    console.log('Password:', pwd);

    // Trouver l'utilisateur par login
    const user = usagersData.find(u => u.login === login);
    
    if (user) {
        // Vérifier si le mot de passe est correct
        if (user.pwd === pwd) {
            console.log('Utilisateur trouvé:', user);
            let fileName;
            switch (user.acces) {
                case 'admin':
                    fileName = path.join(__dirname, 'pagesWeb', 'pageAdmin.html');
                    break;
                case 'restreint':
                    fileName = path.join(__dirname, 'pagesWeb', 'pageRestreinte.html');
                    break;
                default:
                    fileName = path.join(__dirname, 'pagesWeb', 'pageUsager.html');
            }

            // Lire et envoyer la page appropriée après avoir remplacé les placeholders
            fs.readFile(fileName, 'utf8', (err, data) => {
                if (err) {
                    console.log(`Erreur lors de la lecture du fichier ${fileName}:`, err);
                    reponse.writeHead(500, { 'Content-Type': 'text/plain' });
                    reponse.end('Erreur de serveur');
                    return;
                }
                data = data.replace(/_nom_nom/g, user.nom).replace(/_login_login/g, user.login);
                reponse.writeHead(200, { 'Content-Type': 'text/html' });
                reponse.end(data);
            });
        } else {
            // Mot de passe invalide
            console.log('Mot de passe invalide');
            reponse.writeHead(401, { 'Content-Type': 'text/html' });
            reponse.end('<h1>Page non autorisée</h1><p>Mot de passe invalide</p>');
        }
    } else {
        // Login invalide
        console.log('Login invalide');
        reponse.writeHead(401, { 'Content-Type': 'text/html' });
        reponse.end('<h1>Page non autorisée</h1><p>Login invalide</p>');
    }
}

// Créer le serveur HTTP
const serveur = http.createServer((requete, reponse) => {
    console.log(`Requête reçue: ${requete.method} ${requete.url}`);
    
    if (requete.method === 'POST' && requete.url === '/traite_forme.html') {
        let postData = '';
        requete.on('data', (donnees) => {
            postData += donnees;
        });
        requete.on('end', () => {
            console.log('Données POST reçues:', postData);
            const params = new URLSearchParams(postData);
            traiteRequete(params, reponse);
        });
    } else if (requete.method === 'GET' && requete.url.startsWith('/traite_forme.html?')) {
        const params = new URLSearchParams(requete.url.split('?')[1]);
        console.log('Données GET reçues:', params.toString());
        traiteRequete(params, reponse);
    } else if (requete.method === 'GET' && (requete.url === '/' || requete.url === '/login.html' || requete.url === '/login_get.html')) {
        let fileName = requete.url === '/' ? 'login.html' : requete.url.substring(1);
        fournirPageWeb(path.join(__dirname, 'pagesWeb', fileName), reponse);
    } else {
        console.log('Page non autorisée demandée:', requete.url);
        reponse.writeHead(401, { 'Content-Type': 'text/html' });
        reponse.end('<h1>Page non autorisée</h1>');
    }
});

// Démarrer le serveur
serveur.listen(port, () => {
    console.log(`Le serveur est en cours d'exécution sur http://localhost:${port}`);
});






 

