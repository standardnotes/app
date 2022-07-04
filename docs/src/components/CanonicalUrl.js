import React from 'react';
import Head from '@docusaurus/Head';

const CanonicalUrl = ({ canonicalUrl }) => (
  <Head>
    <link rel="canonical" href={canonicalUrl} />
  </Head>
);

export default CanonicalUrl;
