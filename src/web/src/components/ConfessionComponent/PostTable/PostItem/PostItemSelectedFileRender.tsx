import React from "react";

interface Props {
  files: File[];
}

const PostItemSelectedFileRender: React.FC<Props> = ({ files }) => {
    console.log(files);

  return (
    <div className="mt-4 flex gap-3 flex-wrap">
      {files.map((file, i) => (
        <img key={i} src={URL.createObjectURL(file)} alt={`Ảnh ${i + 1}`} className="w-24 h-24 object-cover rounded-lg border" />
      ))}
    </div>
  );
};

export default PostItemSelectedFileRender;
