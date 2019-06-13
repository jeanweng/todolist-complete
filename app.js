//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-zhiying:test123@cluster0-tq8cq.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your to do list!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete a item."
});

const defaultItems = [item1, item2, item3];

// Home Route
app.get("/", function(req, res) {
  //If to do list is empty, add default items and redirect to home route
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err){
        if(err) console.log(err);
        else console.log("Successfully saved default items in DB.");
      })
      res.redirect("/");
    }
    // If to do list is not empty, render found items in the list
    else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

// Custom Route
app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      //If nothing is found with name of customListName, put defaultItems in the list and redirect
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      //If there are items with name of customListName, render found items in the list
      else {
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){
  //Get new item added to the list and the custom list name it was added in
  const itemName = req.body.newItem;
  const listName = req.body.list;
  //Create an item with the item name
  const item = new Item({
    name: itemName
  });
  //If the list name is "Today", save the item and redirect to home route
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
  //If the list name is not "Today", push the item to the custom list, save and redirect to the custom list
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req,res){
  //Get the id of the checked item and the list name it belongs to.
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    //If the list name is "Today", find and remove the item with the id, then redirect to home route
    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, function(err){
        if(err) console.log(err);
        else {
          console.log("Successfully remove checked item from DB");
          res.redirect("/");
        }
      });
    }else{
    //If the list name is a custom list, find the item with id, use $pull to remove it from the list
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
        if(!err) res.redirect("/" + listName);
      });
    }
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started on port 3000");
});
