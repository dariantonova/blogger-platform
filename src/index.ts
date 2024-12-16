import {app} from "./app";
import {SETTINGS} from "./settings";
import {initialDb, runDb, setDb} from "./db/db";

const startApp = async () => {
    await runDb();
    await setDb(initialDb);
    app.listen(SETTINGS.PORT, () => {
        console.log('Server listening to port ' + SETTINGS.PORT);
    });
};

startApp();