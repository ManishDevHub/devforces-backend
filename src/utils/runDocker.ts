
import fs from 'fs'
import path, { resolve } from 'path'
import { exec } from 'child_process'
import { v4 as uuid } from 'uuid'




export const runDocker = ({
    language,
    code ,
    tests
}:{
    language:  "node" | "python" | "java",
    code: string,
    tests: any
}) : Promise<any> =>{
    return new Promise(( resolve , reject) => {
        const id = uuid();
        const dir = path.join("/tem", id)

        fs.mkdirSync(dir);

        fs.writeFileSync(`${dir}/tests.json`, JSON.stringify(tests));

        if( language === "node"){
            fs.writeFileSync(`${dir}/user_code.js`, code);
        }

        if(language === "python"){
            fs.writeFileSync(`${dir}/main.py`, code);
        }
        if( language === "java"){
            fs.writeFileSync(`${dir}/Main.java`, code);
        }

        const image = 
        language === "node"? "sandbox-node": language === "python"?"sandbox-python":"sandbox-java";

        const cmd = ` docker run --rm -v ${dir}:/app ${image}`;

        exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
           if (err) {
    return resolve({
      status: "FAILED",
      error: stderr || err.message,
    });
  }

  try {
    resolve(JSON.parse(stdout));
  } catch {
    resolve({
      status: "FAILED",
      error: "Invalid JSON output",
      raw: stdout,
    });
  }
});
    })
}