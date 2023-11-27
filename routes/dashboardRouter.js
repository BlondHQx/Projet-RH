const dashboardRouter = require('express').Router();
const companyModel = require('../models/companyModel');
const employeeModel = require('../models/employeeModel')
const fonctionModel = require('../models/fonctionModel')
const authguard = require("../services/authguard")
const upload = require('../services/multer')
const fs = require('fs');


///page dashboard
dashboardRouter.get('/dashboard', authguard, async (req, res) => {
    try {
        let company = await companyModel.findOne({ _id: req.session.userId }).populate("employees")
        let employees = company.employees;
        let search = req.query.search;
        let selectedFunctions = req.query.fonction;
        if (search) {
            employees = employees.filter(employees => {
                return employees.name.toLowerCase().includes(search.toLowerCase());
            });
        }
        // Filtrer les employés par fonction sélectionnée
        if (selectedFunctions) {
            employees = employees.filter(employee => {
                return selectedFunctions.includes(employee.fonction);
            });
        }
        let companyFonctions = await companyModel.findOne({ _id: req.session.userId }).populate("fonctions")
        let fonctions = companyFonctions.fonctions;
        res.render('templates/dashboard.twig', {
            employees: employees,
            search: search,
            filterFunction: selectedFunctions,
            fonctions: fonctions,
        })
    } catch (error) {
        console.log(error);
        res.json(error)
    }
})

///page addemployee
dashboardRouter.get('/addemployee', authguard, async (req, res) => {
    try {
        // let fonctions = await fonctionModel.find()
        let companyFonctions = await companyModel.findOne({ _id: req.session.userId }).populate("fonctions")
        let fonctions = JSON.stringify(companyFonctions.fonctions);
        res.render('templates/addEmployee.twig',{
            fonctions: fonctions,
        })
    } catch (error) {
        console.log(error);
        res.json(error)
    }
})

//ajouter employé
dashboardRouter.post('/addemployee', authguard, upload.single('photo'), async (req, res) => {  
    try {
        let employee = new employeeModel(req.body)   
        if (req.file) {                              
            employee.photo = req.file.filename;      
        }
        else {
            employee.photo = ""                      
        }
        await employee.save()                        
        await companyModel.updateOne({ _id: req.session.userId }, { $push: { employees: employee } })

        let companyFonctions = await companyModel.findOne({ _id: req.session.userId }).populate("fonctions")
        let fonctions = companyFonctions.fonctions
        let existingFunction = fonctions.find(fonction => fonction.fonction === req.body.fonction);
        if (!existingFunction) {
          // La fonction n'existe pas, vous pouvez créer un nouvel enregistrement
          let fonction = new fonctionModel(req.body);
          await fonction.save();
          await companyModel.updateOne({ _id: req.session.userId }, { $push: { fonctions: fonction } });
        }
        res.redirect('/dashboard')
    }
    catch (error) {
        console.log(error)
        res.send(error)
    }
})

//supprimer un employé
dashboardRouter.get('/deleteEmployee/:id', authguard, async (req, res) => {
    try {
        let ids = req.params.id.split(',')
        let company = req.session.user
        for (let i = 0; i < ids.length; i++) {
            if (ids[i]) {
                let employee = await employeeModel.findOne({ _id: ids[i] })
                // Vérifier si l'employé a une image associée
                if (employee.photo) {
                    // Supprimer le fichier d'image
                    fs.unlink(`views/assets/img/uploads/${employee.photo}`, (err) => {
                        if (err) {
                            console.error('Erreur lors de la suppression du fichier :', err);
                            // Gérer l'erreur de suppression du fichier
                        } else {
                            console.log('Fichier supprimé avec succès');
                        }
                    });
                }
                company.employees.pull(employee)
                await company.updateOne(company)
                await employeeModel.deleteOne({ _id: ids[i] })
            }
        }
        res.redirect('/dashboard')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

//blamer employé
dashboardRouter.get('/blame/:id', authguard, async (req, res) => {
    try {
        let ids = req.params.id.split(',')
        for (let i = 0; i < ids.length; i++) {
            if (ids[i]) {
                let employee = await employeeModel.findOne({ _id: ids[i] })
                employee.blames++
                if (employee.blames >= 3) {
                    let company = req.session.user
                    // Vérifier si l'employé a une image associée
                    if (employee.photo) {
                        // Supprimer le fichier d'image
                        fs.unlink(`views/assets/img/uploads/${employee.photo}`, (err) => {
                            if (err) {
                                console.error('Erreur lors de la suppression du fichier :', err);
                                // Gérer l'erreur de suppression du fichier
                            } else {
                                console.log('Fichier supprimé avec succès');
                            }
                        });
                    }
                    company.employees.pull(employee)
                    await company.updateOne(company)
                    await employeeModel.deleteOne({ _id: ids[i] })
                }
                await employee.updateOne(employee)
            }
        }
        res.redirect('/dashboard')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

//afficher un employé avant de le modifier
dashboardRouter.get('/updateEmployee/:id', authguard, async (req, res) => {
    try {
        let employee = await employeeModel.findOne({ _id: req.params.id })
        let fonctions = await fonctionModel.find()
        res.render("templates/addEmployee.twig", {
            employee: employee, 
            fonctions: fonctions,                   
        })
    }
    catch (error) {
        console.log(error)
        res.send(error)
    }
})

//modifier l'employé'
dashboardRouter.post('/updateEmployee/:id', authguard, upload.single('photo'), async (req, res) => {
    try {
        let employee = await employeeModel.findOne({ _id: req.params.id })
        let company = req.session.user
        let update = req.body                                                     // creation de l'objet update avec les elm du form de la requete
        if (req.file) {                                                            // si une image est en requete
            if (employee.photo) {                                                  //si une image est déja en bdd
                fs.unlink(`views/assets/img/uploads/${employee.photo}`);           // Supprimer le fichier d'image
            }
            update.photo = req.file.filename                                      //ajout du nom de l'image à l'objet update
        } else {
            update.photo = employee.photo
        }
        await employee.updateOne(update)
        let companyFonctions = await companyModel.findOne({ _id: req.session.userId }).populate("fonctions")
        let fonctions = companyFonctions.fonctions
        let existingFunction = fonctions.find(fonction => fonction.fonction === req.body.fonction);
        if (!existingFunction) {
          // La fonction n'existe pas, vous pouvez créer un nouvel enregistrement
          let fonction = new fonctionModel(req.body);
          await fonction.save();
          await companyModel.updateOne({ _id: req.session.userId }, { $push: { fonctions: fonction } });
        }
        res.redirect('/dashboard')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

//editer fonctions
dashboardRouter.get('/updateFonctions', authguard , async (req, res) => {
    try {
        let companyFonctions = await companyModel.findOne({ _id: req.session.userId }).populate("fonctions")
        let fonctions = companyFonctions.fonctions;
        // let fonctions = await fonctionModel.find()
        res.render('templates/listFonction.twig', {
            fonctions: fonctions,
        })
    } catch (error) {
        console.log(error);
        res.json(error)
    }
})

//modifier fonction
dashboardRouter.post('/updateFonction/:id', authguard, async (req, res) => {
    try {
        let fonction = await fonctionModel.findOne({ _id: req.params.id })        //creation de l'objet project à partir de l'elem trouvé en bdd par rapport à son id
        let update = req.body                                                     // creation de l'objet update avec les elm du form de la requete
       
        await fonction.updateOne(update)
       
        res.redirect('/updateFonctions')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

//supprimer une fonction
dashboardRouter.get('/deleteFonction/:id', authguard, async (req, res) => {
    try {
        await fonctionModel.deleteOne({ _id: req.params.id })
        res.redirect('/updateFonctions')
    } catch (error) {
        console.log(error)
        res.send(error)
    }
})

module.exports = dashboardRouter