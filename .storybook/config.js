import { configure } from '@storybook/react'
import '../src/App.css'
import "font-awesome/css/font-awesome.min.css"

configure(require.context('../src', true, /\.stories\.tsx/), module)
