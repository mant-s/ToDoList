require("dotenv").config();
console.log(process.env)
const express = require("express");
// const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();
const PORT = process.env.PORT || 3000;
mongoose.set("strictQuery", false);

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Importing secrets document
// const secrets = require(__dirname + "/.secrets.js").secrets;

// Creating MongoDB with Mongoose
var mongoURI = process.env.MONGO_URI;

const connectDB = async() => {
    try {
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

// mongoose.connect("mongodb+srv://" + myUsername + ":" + myPassword + "@cluster0.vqmkiun.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
    name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your To Do List!",
});

const item2 = new Item({
    name: "Hit the + button to add a new item.",
});

const item3 = new Item({
    name: "<-- hit this to delete an item.>",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

app.get("/", function (req, res) {
    // const day = date.getDate();

    // res.render("list", {listTitle: day, newListItems: items});

    Item.find(function (err, items) {
        // Adding items only if default items have not already been added
        if (items.length === 0) {
            Item.insertMany(defaultItems, function (error) {
                if (error) {
                    console.log(error);
                } else {
                    console.log("Default items successfully added");
                    // redirect is to re-load the page, to pass this into the render function in the 'else' portion.
                    res.redirect("/");
                }
            });
        }
        if (err) {
            console.log(err);
        } else {
            // console.log(items);
            res.render("list", { listTitle: "Today", newListItems: items });
        }
    });
});

app.get("/:customListName", function (req, res) {
    const customListName = _.lowerCase(req.params.customListName);
    if (customListName == "favicon ico") {
      return
    }

    List.findOne({ name: customListName }, function (err, foundList) {
        if (!err) {
            if (foundList) {
                // Show list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItems: foundList.items,
                });
            } else {
                // Create new list
                const list = new List({
                    name: customListName,
                    items: defaultItems,
                });

                list.save();
                res.redirect("/" + customListName);
            }
        } else {
            console.log(err);
        }
    });
});

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName,
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName }, function (err, foundList) {
            if (err) {
                console.log(err);
            } else {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            }
        });
    }
});

app.post("/delete", function (req, res) {
    console.log(req.body.checkbox);
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(itemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("item successfully removed!");
            }
        });
        res.redirect("/");
    } else {
        List.findOneAndUpdate(
            { name: listName },
            {
                $pull: {
                    items: { _id: itemId },
                },
            },
            function (err, results) {
                if (!err) {
                    console.log(results);
                    res.redirect("/" + listName);
                }
            }
        );
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

connectDB().then(() => {
    app.listen(PORT, function(){
        console.log(`Listening on port ${PORT}`);
    })
})
