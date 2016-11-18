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

/* eslint-env mocha */
/* eslint-disable padded-blocks, no-unused-expressions */

import React from 'react';
import { expect } from 'chai';
import { render } from 'enzyme';
import App from '../App';
import Layout from './Layout';

describe('Layout', () => {

  it('renders children correctly', () => {
    const wrapper = render(
      <App context={{ insertCss: () => {} }}>
        <Layout>
          <div className="child" />
        </Layout>
      </App>,
    );
    expect(wrapper.find('div.child').length).to.eq(1);
  });

});
