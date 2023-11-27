const multer = require('multer');
// Configuration de Multer pour spécifier où enregistrer les fichiers
const mimeType = [
    'image/jpg',
    'image/jpeg',
    'image/png',
    'image/svg',
]
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Indique le dossier de destination des fichiers
        cb(null, 'views/assets/img/uploads');
    },
    filename: (req, file, cb) => {
        let extArray =  file.mimetype.split("/")
        let extension =  extArray[extArray.length -1]
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // Génère un nom de fichier unique pour éviter les collisions
        cb(null, file.originalname + '-' + uniqueSuffix + '.' + extension);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file ,cb){
        if(!mimeType.includes(file.mimetype)){
            req.multerError = true
            return cb(null, false)
        }else{
            return cb(null, true)
        }
    }
});

module.exports = upload;