const formatFileSize = (number) => {
  let formattedSize;

  switch (true) {
    case number < 1000:
      formattedSize = `${number} bytes`;
      break;
    case number >= 1000 && number < 1000000:
      formattedSize =`${(number / 1000).toFixed(1)} KB`;
      break;
    case number >= 1000000:
      formattedSize = `${(number / 1000000).toFixed(1)} MB`;
      break;
  }

  return formattedSize;
};

export default formatFileSize;

// Using base 2

// const formatFileSize = (number) => {
//   let formattedSize;

//   switch (true) {
//     case number < 1024:
//       formattedSize = `${number} bytes`;
//       break;
//     case number >= 1024 && number < 1048576:
//       formattedSize =`${(number / 1024).toFixed(1)} KB`;
//       break;
//     case number >= 1048576:
//       formattedSize = `${(number / 1048576).toFixed(1)} MB`;
//       break;
//   }

//   return formattedSize;
// };
