function ShareDetails({ share }) {

  return (
    <div>

      <h3>{share.name}</h3>

      <p>Symbol: {share.symbol}</p>

      <p>Price: ${share.price}</p>

      <p>Portfolio: {share.portfolio}</p>

      <p>Sentiment: {share.sentiment}</p>

      <p>News Insight: {share.news}</p>

    </div>
  );

}

export default ShareDetails;
