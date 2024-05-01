'use client';
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [textfield, setTextfield] = useState('');
  const [reply, setReply] = useState(null);
  const [image, setImage] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      alert('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    // formData.append('textfield', textfield);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData, // No need to set content type; browser does it for you with FormData
      });

      const res = await response.json();
      // setReply(result?.content);
      const { result, image } = res;
      const { content } = result;
      console.log('result', result);
      setReply(content);
      setImage(image);
      // alert(result); // Displaying the response message
    } catch (error) {
      console.error('Error:', error);
      alert('Error uploading file.');
    }
  };

  return (
    <div className='flex flex-col gap-10'>
      <form onSubmit={handleSubmit}>
        <input
          type='file'
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type='submit'>PROCESS</button>
      </form>
      <div className='flex flex-row'>
        {image && (
          <div className='w-[300px] min-w-[300px]'>
            <img src={image} className='w-full aspect-auto' />
          </div>
        )}
        {reply && <div>{reply}</div>}
      </div>
    </div>
  );
}
