import React from 'react';
import Layout from '@theme/Layout';

import { Redirect } from '@docusaurus/router';

function Hello() {
  return <Redirect to="/listed/settings" />;
}

export default Hello;
