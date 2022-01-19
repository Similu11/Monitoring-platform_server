import { cssCase } from "cheerio/lib/utils";

class RedisTool {
    constructor(cli){
        this.cli = cli;
    }
    getHsData(c, model, key) {
        return c.hGetAll(model);
    }

    setHsData(c, model, key, value) {
        return c.hSet(model, key, value);
    }

    delHsData(c, model){
        return c.del(model);
    }

}
export default RedisTool;