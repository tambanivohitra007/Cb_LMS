import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder = "Enter description...", className = "" }) => {
    // Toolbar configuration for our WYSIWYG editor
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }],
            ['blockquote', 'code-block'],
            ['link'],
            [{ 'align': [] }],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ]
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'blockquote', 'code-block',
        'link', 'align',
        'color', 'background'
    ];

    return (
        <div className={`rich-text-editor ${className}`}>
            <ReactQuill
                value={value || ''}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                theme="snow"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px'
                }}
            />
        </div>
    );
};

export default RichTextEditor;
