/**
 * Copyright 2016 Udia Software Incorporated
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'path';
import fetch from 'node-fetch';
import { writeFile, makeDir } from './lib/fs';
import runServer from './runServer';

// Enter your paths here which you want to render as static
// Example:
// const routes = [
//   '/',           // => build/public/index.html
//   '/page',       // => build/public/page.html
//   '/page/',      // => build/public/page/index.html
//   '/page/name',  // => build/public/page/name.html
//   '/page/name/', // => build/public/page/name/index.html
// ];
const routes = [
  '/',
  '/contact',
  '/login',
  '/register',
  '/about',
  '/privacy',
  '/404', // https://help.github.com/articles/creating-a-custom-404-page-for-your-github-pages-site/
];

async function render() {
  const server = await runServer();

  // add dynamic routes
  // const products = await fetch(`http://${server.host}/api/products`).then(res => res.json());
  // products.forEach(product => routes.push(
  //   `/product/${product.uri}`,
  //   `/product/${product.uri}/specs`
  // ));

  await Promise.all(routes.map(async (route, index) => {
    const url = `http://${server.host}${route}`;
    const fileName = route.endsWith('/') ? 'index.html' : `${path.basename(route, '.html')}.html`;
    const dirName = path.join('build/public', route.endsWith('/') ? route : path.dirname(route));
    const dist = `${dirName}${fileName}`;
    const timeStart = new Date();
    const response = await fetch(url);
    const timeEnd = new Date();
    const text = await response.text();
    await makeDir(dirName);
    await writeFile(dist, text);
    const time = timeEnd.getTime() - timeStart.getTime();
    console.log(`#${index + 1} ${dist} => ${response.status} ${response.statusText} (${time} ms)`);
  }));

  server.kill('SIGTERM');
}

export default render;
