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
  const isDateValid = isValid(new Date(dueDate));
  if (isDateValid === true) {
    let oldDate = new Date(dueDate);
    let year = oldDate.getFullYear();
    let month = oldDate.getMonth();
    let day = oldDate.getDate();
    let newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    const checkCategoryAndDate = async () => {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isDateValid) {
          const postTodoQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date) VALUES(${id},'${todo}','${priority}','${status}','${category}','${newDate}');`;
          await database.run(postTodoQuery);
          response.status(200);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    };
    const checkPriorityAndStatus = async () => {
      if (priority === "LOW" || priority === "HIGH" || priority === "MEDIUM") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          checkCategoryAndDate();
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    };
    checkPriorityAndStatus();
  } else {
    response.status(400);
    response.send("Invalid Due Date");
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
  const {
    todo = previousDatabaseResponse.todo,
    priority = previousDatabaseResponse.priority,
    status = previousDatabaseResponse.status,
    category = previousDatabaseResponse.category,
    dueDate = previousDatabaseResponse.due_date,
  } = request.body;
  if (previousDatabaseResponse !== undefined) {
    if (updateColumn === "Status") {
      if (status === "DONE" || status === "TO DO" || status === "IN PROGRESS") {
        const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',status='${status}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    }
    if (updateColumn === "Priority") {
      if (priority === "LOW" || priority === "MEDIUM" || priority === "HIGH") {
        const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',status='${status}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
    }
    if (updateColumn === "Category") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',status='${status}',due_date='${dueDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    }
    if (updateColumn === "Todo") {
      const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',status='${status}',due_date='${dueDate}' WHERE id=${todoId};`;
      await database.run(updateQuery);
      response.send("Todo Updated");
    }
    if (updateColumn === "Due Date") {
      let oldDate = new Date(dueDate);
      let isOldDateValid = isValid(new Date(oldDate));
      if (isOldDateValid) {
        let year = oldDate.getFullYear();
        let month = oldDate.getMonth();
        let day = oldDate.getDate();
        let newDate = format(new Date(year, month, day), "yyyy-MM-dd");
        let isNewDateValid = isValid(new Date(newDate));
        const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',category='${category}',status='${status}',due_date='${newDate}' WHERE id=${todoId};`;
        await database.run(updateQuery);
        response.send("Due Date Updated");
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

const hasStatus = (requstQuery) => {
  return requstQuery.status !== undefined;
};

const hasStatusCheck = (requestQuery) => {
  if (
    requestQuery.status === "DONE" ||
    requestQuery.status === "IN PROGRESS" ||
    requestQuery.status === "TO DO"
  ) {
    let query = `SELECT * FROM todo WHERE status='${requestQuery.status}';`;
    return query;
  } else {
    errorText = "Invalid Todo Status";
  }
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityCheck = (requestQuery) => {
  if (
    requestQuery.priority === "LOW" ||
    requestQuery.priority === "HIGH" ||
    requestQuery.priority === "MEDIUM"
  ) {
    let query = `SELECT * FROM todo WHERE priority='${requestQuery.priority}';`;
    return query;
  } else {
    errorText = "Invalid Todo Priority";
  }
};

const hasSearch_q = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const hasSearch_qCheck = (requestQuery) => {
  let query = `SELECT * FROM todo WHERE todo LIKE '%${requestQuery.search_q}%';`;
  return query;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryCheck = (requestQuery) => {
  let category = requestQuery.category;
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    let query = `SELECT * FROM todo WHERE category='${category}';`;
    return query;
  } else {
    errorText = "Invalid Todo Category";
  }
};

let errorText = " ";
let getTodoQuery = " ";

//API-1
app.get("/todos/", async (request, response) => {
  let databaseResponse = null;
  const { search_q = "", status, priority, category } = request.query;
  const getTodosFromDb = async () => {
    try {
      databaseResponse = await database.all(getTodoQuery);
      let responseList = databaseResponse.map((eachtodo) => {
        let result = convertTodoObjectToResponse(eachtodo);
        return result;
      });
      response.send(responseList);
    } catch (e) {
      response.status(400);
      response.send(errorText);
    }
  };
  switch (true) {
    case hasStatus(request.query):
      getTodoQuery = hasStatusCheck(request.query);
      getTodosFromDb();
      break;
    case hasPriority(request.query):
      getTodoQuery = hasPriorityCheck(request.query);
      getTodosFromDb();
      break;
    case hasSearch_q(request.query):
      getTodoQuery = hasSearch_qCheck(request.query);
      getTodosFromDb();
      break;
    case hasCategory(request.query):
      getTodoQuery = hasCategoryCheck(request.query);
      getTodosFromDb();
      break;
  }
});

module.exports = app;
