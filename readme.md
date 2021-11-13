# Descriptive HTML

Descriptive HTML is a new way to write html. It is cleaner, easier and faster.
You can import html, dht **(Descriptive HTML file extension)** and even css files, create templates and reusable code to gain time as well as passing props to these templates to make them truly reusable and customizable.

## Installation

Feel free to clone the project and test it, but it is currently still work in progress

## Usage

```
import "style.css"

template "card" make div with attributes class as "body" and children
     make div with attributes class as "img" and children  end
     make div with attributes class as "div2" and children
          make h1 with children $name end
          make p with children $desc end
          make button with attributes class as "btn" and children "Go back" end
     end
end

make "card" with props
     desc as "hey brother"
     name as "moataz"
end
```

- Run index.js using nodemon and it will add a new html file including all the code you wrote in your dht, html and css files combined together.

## Output

```css
<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      .body {
        width: 30%;
        height: 25em;
        overflow: hidden;
        border: 1px solid black;
      }
      .img {
        background-size: cover;
        background-image: url("https://www.sticky.digital/wp-content/uploads/2013/11/img-6.jpg%27");
        height: 50%;
      }
      .btn {
        background-color: #007bff;
        border-radius: 5px;
        width: 9em;
        color: aliceblue;
        border: none;
        padding: 7px;
      }
      .div2 {
        margin-left: 1em;
      }
    </style>

    <style></style>
  </head>
  <body>
    <div class="body">
      <div class="img"></div>
      <div class="div2">
        <h1>moataz</h1>
        <p>hey brother</p>
        <button class="btn">Go back</button>
      </div>
    </div>
  </body>
</html>

```

## License

[MIT](https://choosealicense.com/licenses/mit/)
