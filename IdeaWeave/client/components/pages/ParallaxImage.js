const ParallaxImage = ({
    url = "/images/image5.jpg",
    children,
    paddingTop = "100px",
    paddingBottom = "75px",
  }) => (
    <div
      style={{
        backgroundImage: `url(${url})`,
        backgroundPosition: "center center",
        backgroundAttachment: "fixed",
        paddingTop: paddingTop,
        paddingBottom: paddingBottom,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        display: "block",
      }}
    >
      {children}
    </div>
  );
  
  export default ParallaxImage;