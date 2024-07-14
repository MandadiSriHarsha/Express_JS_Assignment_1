const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const path = require("path");
const databasePath = path.join(__dirname, "todoApplication.db");
let database = null;

const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is initialized and running at port number 3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDatabaseAndServer();

const convertTodoObjectToResponse = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

//API-2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const databaseResponse = await database.get(getTodoQuery);
  if (databaseResponse !== undefined) {
    response.status(200);
    response.send(convertTodoObjectToResponse(databaseResponse));
  } else {
    response.status(400);
    response.send("Invalid Todo Id");
  }
});

//API-6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const databaseResponse = await database.get(getTodoQuery);
  if (databaseResponse !== undefined) {
    const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
    await database.run(deleteTodoQuery);
    response.status(200);
    response.send("Todo Deleted");
  } else {
    response.status(400);
    response.send("Invalid Todo Id");
  }
});

//API-3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const isQueryDateValid = isValid(new Date(date));
  if (isQueryDateValid) {
    const oldDate = new Date(date);
    const year = oldDate.getFullYear();
    const month = oldDate.getMonth();
    const day = oldDate.getDate();
    const newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    const isDateValid = isValid(new Date(newDate));
    if (isDateValid) {
      const getTodoQuery = `SELECT * FROM todo WHERE due_date='${newDate}';`;
      const databaseResponse = await database.all(getTodoQuery);
      if (databaseResponse !== undefined) {
        let responseList = databaseResponse.map((eachtodo) => {
          let result = convertTodoObjectToResponse(eachtodo);
          return result;
        });
        response.status(200);
        response.send(responseList);
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API-4
app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  const isDueDateValid = isValid(new Date(dueDate));
  if (typeof id === "number") {
    if (todo.length > 1) {
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          if (
            category === "LEARNING" ||
            category === "WORK" ||
            category === "HOME"
          ) {
            if (isDueDateValid) {
              const newDate = new Date(dueDate);
              const year = newDate.getFullYear();
              const month = newDate.getMonth();
              const date = newDate.getDate();
              const formattedDate = format(
                new Date(year, month, date),
                "yyyy-MM-dd"
              );
              const isFormattedDateValid = isValid(new Date(formattedDate));
              if (isFormattedDateValid) {
                const createTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}','${formattedDate}')`;
                await database.run(createTodoQuery);
                response.status(200);
                response.send("Todo Created Successfully");
              } else {
                response.status(400);
                response.send("Invalid Due Date");
              }
            } else {
              response.status(400);
              response.send("Invalid Due Date");
            }
          } else {
            response.status(400);
            response.send("Invalid Category");
          }
        } else {
          response.status(400);
          response.send("Invalid Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Priority");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Text");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Id");
  }
});

//API-5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const getPreviousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const previousDatabaseResponse = await database.get(getPreviousTodoQuery);
  if (previousDatabaseResponse !== undefined) {
    if (updateColumn === "Status") {
      if (
        requestBody.status === "DONE" ||
        requestBody.status === "TO DO" ||
        requestBody.status === "IN PROGRESS"
      ) {
        const updateQuery = `UPDATE todo SET status='${requestBody.status}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    }
    if (updateColumn === "Priority") {
      if (
        requestBody.priority === "LOW" ||
        requestBody.priority === "MEDIUM" ||
        requestBody.priority === "HIGH"
      ) {
        const updateQuery = `UPDATE todo SET priority='${requestBody.priority}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    }
    if (updateColumn === "Category") {
      if (
        requestBody.category === "WORK" ||
        requestBody.category === "HOME" ||
        requestBody.category === "LEARNING"
      ) {
        const updateQuery = `UPDATE todo SET category='${requestBody.category}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    }
    if (updateColumn === "Todo") {
      if (requestBody.todo.length > 1) {
        const updateQuery = `UPDATE todo SET todo='${requestBody.todo}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Todo Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Text");
      }
    }
    if (updateColumn === "Due Date") {
      let oldDate = new Date(requestBody.dueDate);
      let isOldDateValid = isValid(new Date(oldDate));
      if (isOldDateValid) {
        let year = oldDate.getFullYear();
        let month = oldDate.getMonth();
        let day = oldDate.getDate();
        let newDate = format(new Date(year, month, day), "yyyy-MM-dd");
        let isNewDateValid = isValid(new Date(newDate));
        if (isNewDateValid) {
          const updateQuery = `UPDATE todo SET due_date='${newDate}' WHERE id=${todoId};`;
          await database.run(updateQuery);
          response.send("Due Date Updated");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Id");
  }
});

//API-1
const checkIsQueryKeysValid = (keys, queryParams) => {
  const isKeysValid = keys.every(
    (eachitem) =>
      eachitem === "priority" ||
      eachitem === "status" ||
      eachitem === "category" ||
      eachitem === "search_q"
  );
  if (isKeysValid) {
    return true;
  } else {
    return false;
  }
};

let errorTexts = [];

const checkIsQueryValuesValid = (keys, queryValues) => {
  let checkList = [];
  errorTexts = [];
  keys.forEach((eachitem) => {
    if (eachitem === "status") {
      if (
        queryValues.status === "TO DO" ||
        queryValues.status === "IN PROGRESS" ||
        queryValues.status === "DONE"
      ) {
        checkList.push(true);
      } else {
        checkList.push(false);
        errorTexts.push("Invalid Status");
      }
    } else if (eachitem === "priority") {
      if (
        queryValues.priority === "LOW" ||
        queryValues.priority === "MEDIUM" ||
        queryValues.priority === "HIGH"
      ) {
        checkList.push(true);
      } else {
        checkList.push(false);
        errorTexts.push("Invalid Priority");
      }
    } else if (eachitem === "category") {
      if (
        queryValues.category === "WORK" ||
        queryValues.category === "HOME" ||
        queryValues.category === "LEARNING"
      ) {
        checkList.push(true);
      } else {
        checkList.push(false);
        errorTexts.push("Invalid Category");
      }
    }
  });
  const check = checkList.every((eachitem) => eachitem === true);
  return check;
};

app.get("/todos/", async (request, response) => {
  const queryParams = request.query;
  const keys = Object.keys(queryParams);
  const isQueryKeysValid = checkIsQueryKeysValid(keys);
  if (isQueryKeysValid) {
    const isQueryValuesValid = checkIsQueryValuesValid(keys, queryParams);
    if (isQueryValuesValid) {
      const {
        search_q = "",
        priority = "",
        status = "",
        category = "",
      } = request.query;
      const getTodosQuery = `SELECT * FROM todo WHERE priority LIKE '%${priority}%' AND status LIKE '%${status}%' AND category LIKE '%${category}%' AND todo LIKE '%${search_q}%';`;
      const databaseResponse = await database.all(getTodosQuery);
      response.status(200);
      response.send(databaseResponse);
    } else {
      response.status(400);
      response.send(errorTexts.join(", "));
    }
  } else {
    response.status(400);
    response.send("Invalid Query Parameters Keys");
  }
});

module.exports = app;
