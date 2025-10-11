import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api";

const mockNavigate = jest.fn();
const mockLessonId = "123";

jest.mock("../../../components/InstructorTopBar/InstructorTopBar", () => ({
    __esModule: true,
    default: () => <div>Mocked InstructorTopBar</div>,
}));

jest.mock("../../../api");

jest.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ lessonId: mockLessonId }),
}));

import InstructorLessonCreation from "./InstructorLessonCreate";

describe("InstructorLessonCreation", () => {
    const renderComponent = (props = {}) =>
        render(<InstructorLessonCreation {...props} />);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders all form inputs and buttons", () => {
        renderComponent();

        expect(screen.getByLabelText(/Lesson Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Lesson Credits/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Lesson Duration/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Lesson Description/i),
        ).toBeInTheDocument();
        expect(screen.getByLabelText(/Lesson Objective/i)).toBeInTheDocument();
        expect(
            screen.getByLabelText(/Prerequisite Lesson/i),
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /Discard/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /Create/i }),
        ).toBeInTheDocument();
    });

    test("updates input values correctly", () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Lesson Title/i), {
            target: { value: "Intro to Test Casing" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Credits/i), {
            target: { value: "3" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Duration/i), {
            target: { value: "4" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Description/i), {
            target: { value: "Learn Test Casing basics" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Objective/i), {
            target: { value: "Understand Test Casing concepts" },
        });
        fireEvent.change(screen.getByLabelText(/Prerequisite Lesson/i), {
            target: { value: "CS101" },
        });

        expect(
            screen.getByDisplayValue("Intro to Test Casing"),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("3")).toBeInTheDocument();
        expect(screen.getByDisplayValue("4")).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Learn Test Casing basics"),
        ).toBeInTheDocument();
        expect(
            screen.getByDisplayValue("Understand Test Casing concepts"),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("CS101")).toBeInTheDocument();
    });

    test("submits form successfully and shows success modal", async () => {
        api.patch.mockResolvedValue({ data: { lesson_id: mockLessonId } });
        api.post.mockResolvedValue({ data: {} });

        const onCourseCreated = jest.fn();
        renderComponent({ onCourseCreated });

        fireEvent.change(screen.getByLabelText(/Lesson Title/i), {
            target: { value: "Intro to Test Casing" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Credits/i), {
            target: { value: "3" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Duration/i), {
            target: { value: "4" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Description/i), {
            target: { value: "Learn Test Casing basics" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Objective/i), {
            target: { value: "Understand Test Casing concepts" },
        });
        fireEvent.change(screen.getByLabelText(/Prerequisite Lesson/i), {
            target: { value: "CS101,CS102" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() =>
            expect(
                screen.getByText(/Lesson Created Successfully/i),
            ).toBeInTheDocument(),
        );

        expect(onCourseCreated).toHaveBeenCalled();
        expect(api.patch).toHaveBeenCalledWith(
            `/instructor/lessons/${mockLessonId}/create/`,
            expect.objectContaining({ title: "Intro to Test Casing" }),
        );
        expect(api.post).toHaveBeenCalled();
    });

    test("handles API errors gracefully", async () => {
        jest.spyOn(window, "alert").mockImplementation(() => {});
        api.patch.mockRejectedValue(new Error("Server error"));

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Lesson Title/i), {
            target: { value: "Intro to Test Casing" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() =>
            expect(window.alert).toHaveBeenCalledWith(
                "Error creating lesson. Please try again.",
            ),
        );
    });

    test("discard button resets form", () => {
        renderComponent();

        fireEvent.change(screen.getByLabelText(/Lesson Title/i), {
            target: { value: "Temp Lesson" },
        });
        fireEvent.change(screen.getByLabelText(/Lesson Credits/i), {
            target: { value: "3" },
        });

        fireEvent.click(screen.getByRole("button", { name: /Discard/i }));

        expect(
            screen.queryByDisplayValue("Temp Lesson"),
        ).not.toBeInTheDocument();
        expect(screen.queryByDisplayValue("3")).not.toBeInTheDocument();
    });

    test("navigates to lesson page after success modal", async () => {
        api.patch.mockResolvedValue({ data: { lesson_id: mockLessonId } });
        api.post.mockResolvedValue({ data: {} });

        renderComponent();

        fireEvent.change(screen.getByLabelText(/Lesson Title/i), {
            target: { value: "Intro to Test Casing" },
        });
        fireEvent.click(screen.getByRole("button", { name: /Create/i }));

        await waitFor(() =>
            expect(
                screen.getByText(/Lesson Created Successfully/i),
            ).toBeInTheDocument(),
        );

        fireEvent.click(
            screen.getByRole("button", { name: /Go to lesson page/i }),
        );
        expect(mockNavigate).toHaveBeenCalledWith("/instructor/course-list");
    });
});
