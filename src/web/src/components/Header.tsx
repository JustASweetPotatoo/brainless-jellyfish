interface Props {
  title: string,
  subtitle: string
}

const Header = (props: Props) => {
  return (
    <div className="mb-[30px]">
      <h3 className="text-2xl font-bold text-grey-100 m-0 mb-[5px]">
        {props.title}
      </h3>
      <h5 className="text-base text-green-400">
        {props.subtitle}
      </h5>
    </div>
  );
};

export default Header;
