import express from "express";
import Parser from "rss-parser";
import axios from "axios";
import TurndownService from "turndown";
import FB from "fb";
import base64 from "base64-js";
import os from "os";
import { exec } from "child_process";
import { error } from "console";

const app = express();
const turndownService = new TurndownService();

let result;
app.get("/", (res) => {
  let parser = new Parser();
  (async () => {
    let data = await parser.parseURL("https://legacy.reactjs.org/feed.xml");
    // const title = JSON.stringify(data.items[0].title)
    const link = data.items[0].link;
    console.log("link", link);
    axios
      .get(link)
      .then(function (response) {
        const markdown = turndownService
          .remove([
            "script",
            "link",
            "head",
            "svg",
            "defs",
            "symbol",
            "path",
            "nav",
            "li",
            "ul",
            "style",
          ])
          .turndown(response.data);
        // console.log('markdown',markdown);

        let data = JSON.stringify({
          messages: [
            {
              content:
                "Bạn lả chuyên gia tóm tắt nội dung về các bài viết công nghệ",
              role: "system",
            },
            {
              content:
                'Tôi sẽ cung cấp cho bạn một bài báo, tôi muốn bạn tóm tắt cho tôi trong vòng một trăm từ, vui lòng trả về chỉ nội dung tóm tắt thôi và không có tiền tố gì. Đây là nội dung "' +
                markdown +
                '"',
              role: "user",
            },
          ],
          model: "deepseek-chat",
          frequency_penalty: 0,
          max_tokens: 2048,
          presence_penalty: 0,
          stop: null,
          stream: false,
          temperature: 1,
          top_p: 1,
        });

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: "https://api.deepseek.com/v1/chat/completions",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer sk-79923709c57247baac7c278ba7bcdea1",
          },
          data: data,
        };

        axios(config)
          .then((response) => {
            const respon = JSON.stringify(
              response.data.choices[0].message.content
            );
            console.log("content", respon);
            const charsB64 = base64.fromByteArray(Buffer.from(respon, "utf-8"));
            console.log("char", charsB64);

            const status = "adb shell input tap 450 450";
            const clickStatus = "adb shell input tap 450 670";
            const command = `adb shell am broadcast -a ADB_INPUT_B64 --es msg ${charsB64}`;
            const submitBtn = "adb shell input tap 550 1800";

            setTimeout(() => {
              exec(status);
            }, 1000);

            setTimeout(() => {
              exec(clickStatus);
            }, 2000);

            setTimeout(() => {
              exec(command);
            }, 3000);

            setTimeout(() => {
              exec(submitBtn);
            }, 10000);
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .finally(function () {
        // always executed
      });
  })();
});

app.listen(3200, () => console.log("Example app is listening on port 3200."));
