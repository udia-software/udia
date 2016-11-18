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

import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Feedback.css';

class Feedback extends React.Component {
  render() {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <a
            className={s.link}
            href="https://gitter.im/kriasoft/react-starter-kit"
          >Ask a question</a>
          <span className={s.spacer}>|</span>
          <a
            className={s.link}
            href="https://github.com/kriasoft/react-starter-kit/issues/new"
          >Report an issue</a>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Feedback);
