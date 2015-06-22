var Skill = require('../models/skill');
var Promise = require('bluebird');
var LearnSkill = require('../models/learnSkill');
var TeachSkill = require('../models/teachSkill');

module.exports = {
  getSkill: function (req, res, next, skillname) {
    new Skill({ skill_name: skillname })
      .fetch({
        withRelated: ['teachers', 'learners']
      })
      .then(function (skill) {
        var result = {};

        result.skill_name = skill.attributes.skill_name;

        result.learners = [];
        skill.relations.learners.models.forEach(function (item) {
          result.learners.push(item.attributes);
        });

        result.teachers = [];
        skill.relations.teachers.models.forEach(function (item) {
          result.teachers.push(item.attributes);
        });

        res.send(200, result);
      });
  },

  allSkills: function (req, res, next) {
    new Skill()
      .fetchAll({
        withRelated: ['teachers', 'learners']
      })
      .then(function (skills) {
        var result = {};

        var models = skills.models;

        for (var i = 0; i < models.length; i++) {
          var skill = models[i];
          result[skill.attributes.skill_name] = {learners: [],teachers:[]};

          skill.relations.learners.models.forEach(function (item) {
            result[skill.attributes.skill_name].learners.push(item.attributes);
          });

          skill.relations.teachers.models.forEach(function (item) {
            result[skill.attributes.skill_name].teachers.push(item.attributes);
          });

        };
        res.send(200, result);
      });
  },

  findOrCreate: function(req) {
    return new Promise(function(resolve, reject) {
      new Skill({ skill_name: req.body.skill })
        .fetch().then(function (found) {
          if (found) {
            req.body.skillId = found.attributes.id;
            resolve(req);
          } else {
            // add skill to db
            var newSkill = new Skill({
              skill_name: req.body.skill,
            });
            newSkill.save()
            .then(function(){
              req.body.skillId = newSkill.attributes.id;
              resolve(req);
            }).catch(reject);
          }
        });
    });
  },

  relate: function(data,res,next) {
    //data = { type: teach, skill: javascript, skilllevel: 3, userId: 3, skillId: 5}
    if(data.type === "teach"){
      new TeachSkill({skill_id: data.skillId, user_id: data.userId})
        .fetch()
        .then(function(item){ // check if already exists, update if exist
          if(item){
            item.attributes.skill_level = parseInt(data.skilllevel);
            item.save().then(function(){
              console.log('update complete!');
              res.send(data);
            });
          }else{ 
            // create a new entry
            var entry = new TeachSkill({
              user_id: data.userId,
              skill_id: data.skillId,
              skill_level: data.skilllevel
            });
            entry.save().then(function(){
              res.send(entry);
            });
          }
        });
    }else if(data.type === "learn"){  // Learn skills
      new LearnSkill({skill_id: data.skillId, user_id: data.userId})
        .fetch()
        .then(function(item){ // check if already exists, update if exist
          if(item){
            item.attributes.skill_level = parseInt(data.skilllevel);
            item.save().then(function(){
              console.log('update complete!');
              res.send(data);
            });
          }else{ 
            // create a new entry
            var entry = new LearnSkill({
              user_id: data.userId,
              skill_id: data.skillId,
              skill_level: data.skilllevel
            });
            entry.save().then(function(){
              res.send(entry);
            });
          }
        });
    }else{
      res.send("Specify Learn/Teach Type!");
    }
    
  }

};